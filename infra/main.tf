# Terraform — Runli AWS ECS Production Deployment
# ─────────────────────────────────────────────────
# Prerequisites:
#   1. AWS CLI configured: `aws configure`
#   2. Terraform installed: https://developer.hashicorp.com/terraform/install
#   3. ECR repos created with images already pushed by GitHub Actions CI
#   4. Run: terraform init && terraform plan && terraform apply

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ─────────────────────────────────────────
# Variables
# ─────────────────────────────────────────
variable "aws_region"     { default = "ap-south-1" }
variable "app_name"       { default = "runli" }
variable "gemini_api_key" { sensitive = true }
variable "jwt_secret"     { sensitive = true }
variable "mongodb_uri"    { sensitive = true }

locals {
  ecr_base = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
}

data "aws_caller_identity" "current" {}

# ─────────────────────────────────────────
# VPC & Networking
# ─────────────────────────────────────────
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = { Name = "${var.app_name}-vpc" }
}

resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true
  tags = { Name = "${var.app_name}-subnet-a" }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true
  tags = { Name = "${var.app_name}-subnet-b" }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.app_name}-igw" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
}

resource "aws_route_table_association" "a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

# ─────────────────────────────────────────
# Security Groups
# ─────────────────────────────────────────
resource "aws_security_group" "ecs_sg" {
  name   = "${var.app_name}-ecs-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 5001
    to_port     = 5001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ─────────────────────────────────────────
# ECS Cluster
# ─────────────────────────────────────────
resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-production"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ─────────────────────────────────────────
# IAM Role for ECS Task Execution
# ─────────────────────────────────────────
resource "aws_iam_role" "ecs_task_exec_role" {
  name = "${var.app_name}-ecs-task-exec-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_exec_policy" {
  role       = aws_iam_role.ecs_task_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ─────────────────────────────────────────
# ECS Task Definitions
# ─────────────────────────────────────────
resource "aws_ecs_task_definition" "server" {
  family                   = "${var.app_name}-server"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_exec_role.arn

  container_definitions = jsonencode([{
    name  = "server"
    image = "${local.ecr_base}/runli-server:latest"
    portMappings = [{ containerPort = 5001, hostPort = 5001 }]
    environment = [
      { name = "PORT",          value = "5001" },
      { name = "MONGODB_URI",   value = var.mongodb_uri },
      { name = "REDIS_URI",     value = "redis://localhost:6379" },
      { name = "AI_SERVICE_URL", value = "http://localhost:8000" },
      { name = "JWT_SECRET",    value = var.jwt_secret },
      { name = "GEMINI_API_KEY", value = var.gemini_api_key }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${var.app_name}-server"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

resource "aws_ecs_task_definition" "ai_service" {
  family                   = "${var.app_name}-ai-service"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "3072"
  execution_role_arn       = aws_iam_role.ecs_task_exec_role.arn

  container_definitions = jsonencode([{
    name  = "ai-service"
    image = "${local.ecr_base}/runli-ai-service:latest"
    portMappings = [{ containerPort = 8000, hostPort = 8000 }]
    environment = [
      { name = "GEMINI_API_KEY", value = var.gemini_api_key }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${var.app_name}-ai-service"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

# ─────────────────────────────────────────
# ECS Services (Fargate)
# ─────────────────────────────────────────
resource "aws_ecs_service" "server" {
  name            = "${var.app_name}-server-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.server.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public_a.id, aws_subnet.public_b.id]
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }
}

resource "aws_ecs_service" "ai_service" {
  name            = "${var.app_name}-ai-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.ai_service.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public_a.id, aws_subnet.public_b.id]
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }
}

# ─────────────────────────────────────────
# CloudWatch Log Groups
# ─────────────────────────────────────────
resource "aws_cloudwatch_log_group" "server" {
  name              = "/ecs/${var.app_name}-server"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "ai_service" {
  name              = "/ecs/${var.app_name}-ai-service"
  retention_in_days = 14
}

# ─────────────────────────────────────────
# Outputs
# ─────────────────────────────────────────
output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}
