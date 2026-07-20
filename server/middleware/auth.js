import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, _id: decoded.id }; // Normalize to id and _id for database queries
    req.userId = decoded.id;       // Keep req.userId for backward compatibility
    next();
  } catch (err) {
    console.error("JWT Verify Error:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authenticateToken;
