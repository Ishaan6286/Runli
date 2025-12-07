import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';

const API_URL = "http://localhost:5001/api";

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([
        {
            type: 'bot',
            text: "Hi! I'm your Runli fitness assistant. How can I help you today?",
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const quickActions = [
        { label: '📊 Calculate BMI', action: () => handleQuickAction('bmi') },
        { label: '🎯 Track Habits', action: () => handleQuickAction('habits') },
        { label: '💪 Gym Mode', action: () => handleQuickAction('gymmode') },
        { label: '🍽️ View Diet Plan', action: () => handleQuickAction('diet') },
        { label: '🎥 Workout Videos', action: () => handleQuickAction('videos') },
        { label: '🛍️ Shop Products', action: () => handleQuickAction('shopping') }
    ];

    const handleQuickAction = (type) => {
        let userMessage = '';
        let botResponse = '';
        let navigationPath = null;

        switch (type) {
            case 'bmi':
                userMessage = 'I want to calculate my BMI';
                botResponse = "Great! I'll take you to our BMI calculator. You can enter your height and weight to get instant results and personalized feedback.";
                navigationPath = '/';
                setTimeout(() => {
                    const bmiSection = document.getElementById('bmi-calculator');
                    if (bmiSection) bmiSection.scrollIntoView({ behavior: 'smooth' });
                }, 500);
                break;
            case 'habits':
                userMessage = 'I want to track my habits';
                botResponse = "Great choice! The Habit Tracker helps you build consistency. Create daily habits, track your streaks, and stay motivated with our calendar view!";
                navigationPath = '/habits';
                break;
            case 'gymmode':
                userMessage = 'I want to use Gym Mode';
                botResponse = "Let's get you to Gym Mode! Track your workout sessions with our built-in timer and exercise tracking. Perfect for staying focused at the gym!";
                navigationPath = '/gym-mode';
                break;
            case 'diet':
                userMessage = 'I want to view my diet plan';
                botResponse = "Taking you to your Diet Plan page! Here you can view your personalized meal plan, track completion, and manage your nutrition goals.";
                navigationPath = '/diet-plan';
                break;
            case 'videos':
                userMessage = 'I want to watch workout videos';
                botResponse = "Awesome! Browse our curated collection of workout videos. Find exercises, tutorials, and training guides to level up your fitness!";
                navigationPath = '/videos';
                break;
            case 'shopping':
                userMessage = 'I want to shop for fitness products';
                botResponse = "Check out our Fitness Store! We have premium supplements, gym accessories, and everything you need to support your fitness journey at great prices!";
                navigationPath = '/shopping';
                break;
        }

        setMessages(prev => [
            ...prev,
            { type: 'user', text: userMessage, timestamp: new Date() },
            { type: 'bot', text: botResponse, timestamp: new Date() }
        ]);

        if (navigationPath) {
            setTimeout(() => {
                navigate(navigationPath);
                setIsOpen(false);
            }, 2000);
        }
    };

    const getBotResponse = (userInput) => {
        const input = userInput.toLowerCase().trim();

        // Only use local responses for VERY SPECIFIC navigation requests
        // Everything else should go to Gemini AI

        // BMI Calculator - only if explicitly asking about BMI calculation
        if ((input.includes('bmi') && (input.includes('calculate') || input.includes('calculator'))) ||
            input === 'calculate bmi' || input === 'bmi calculator') {
            return {
                text: "I can help you calculate your BMI! Head to our BMI Calculator on the home page. Just enter your height and weight, and you'll get instant results and personalized health insights.",
                action: () => {
                    navigate('/');
                    setTimeout(() => {
                        const bmiSection = document.getElementById('bmi-calculator');
                        if (bmiSection) bmiSection.scrollIntoView({ behavior: 'smooth' });
                    }, 500);
                    setIsOpen(false);
                }
            };
        }

        // Habit Tracker
        if ((input.includes('habit') && (input.includes('track') || input.includes('tracker'))) ||
            input.includes('habits') || input.includes('streak')) {
            return {
                text: "The Habit Tracker is perfect for building consistency! Create daily habits, track your progress with a calendar view, and maintain streaks. Let me take you there!",
                action: () => {
                    navigate('/habits');
                    setIsOpen(false);
                }
            };
        }

        // Gym Mode
        if ((input.includes('gym') && input.includes('mode')) ||
            (input.includes('workout') && (input.includes('timer') || input.includes('mode')))) {
            return {
                text: "Gym Mode is your workout companion! Track your exercises, use the built-in timer, and stay focused during your gym sessions. Let's get you started!",
                action: () => {
                    navigate('/gym-mode');
                    setIsOpen(false);
                }
            };
        }

        // Diet Plan - updated to point to /diet-plan
        if ((input.includes('diet') && (input.includes('plan') || input.includes('view') || input.includes('see'))) ||
            input.includes('meal plan') || input.includes('nutrition plan')) {
            return {
                text: "View and manage your personalized diet plan! Track meal completion, see your daily nutrition breakdown, and stay on top of your eating goals.",
                action: () => {
                    navigate('/diet-plan');
                    setIsOpen(false);
                }
            };
        }

        // Video Dashboard
        if ((input.includes('video') || input.includes('videos')) &&
            (input.includes('workout') || input.includes('exercise') || input.includes('tutorial'))) {
            return {
                text: "Browse our workout video library! Find exercise tutorials, training guides, and fitness content to help you achieve your goals.",
                action: () => {
                    navigate('/videos');
                    setIsOpen(false);
                }
            };
        }

        // Dashboard - enhanced with new features
        if ((input.includes('dashboard') || input.includes('track progress')) ||
            (input.includes('go to') && input.includes('dashboard'))) {
            return {
                text: "The Dashboard is your fitness command center! Track water, calories, protein, log your weight with progress graphs, view weekly/monthly activity, and monitor your diet plan completion. Let me take you there!",
                action: () => {
                    navigate('/dashboard');
                    setIsOpen(false);
                }
            };
        }

        // Login/Signup - only if explicitly asking about account/login
        if ((input.includes('login') || input.includes('sign up') || input.includes('signup') || input.includes('create account')) &&
            !input.includes('how') && !input.includes('why')) {
            return {
                text: "To access all features, you'll need an account. You can sign up with email or use Google login for quick access. Let me take you to the login page!",
                action: () => {
                    navigate('/login');
                    setIsOpen(false);
                }
            };
        }

        // Shopping - enhanced with updated products
        if ((input.includes('shop') || input.includes('buy') || input.includes('store')) &&
            (input.includes('supplement') || input.includes('product') || input.includes('protein') || input.includes('gym') || input.includes('fitness'))) {
            return {
                text: "Check out our Fitness Store! We have premium supplements (whey protein, creatine), gym bags, shaker bottles, and more at great prices. All products are carefully curated for your fitness journey!",
                action: () => {
                    navigate('/shopping');
                    setIsOpen(false);
                }
            };
        }

        // For everything else, return null to trigger Gemini AI
        return null;
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage = {
            type: 'user',
            text: inputValue,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = inputValue;
        setInputValue('');

        // Check local logic first
        const localResponse = getBotResponse(currentInput);

        // If we have a local navigation response, use it
        if (localResponse) {
            setTimeout(() => {
                const botMessage = {
                    type: 'bot',
                    text: localResponse.text,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, botMessage]);
                if (localResponse.action) setTimeout(localResponse.action, 2000);
            }, 500);
            return;
        }

        // Otherwise, call Gemini AI for general queries
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: currentInput,
                    history: messages.map(m => ({ type: m.type, text: m.text }))
                })
            });
            const data = await res.json();

            const botMessage = { type: 'bot', text: data.text, timestamp: new Date() };
            setMessages(prev => [...prev, botMessage]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { type: 'bot', text: "I'm having trouble connecting right now. Please try again later.", timestamp: new Date() }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <>
            {/* Floating Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        zIndex: 1000,
                        animation: 'pulse 2s infinite'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.4)';
                    }}
                >
                    <MessageCircle size={28} color="white" />
                    <style>{`
            @keyframes pulse {
              0%, 100% { box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4); }
              50% { box-shadow: 0 8px 32px rgba(16, 185, 129, 0.6); }
            }
          `}</style>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        width: '380px',
                        maxWidth: 'calc(100vw - 4rem)',
                        height: '600px',
                        maxHeight: 'calc(100vh - 4rem)',
                        background: 'rgba(26, 26, 26, 0.98)',
                        borderRadius: '1.5rem',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(20px)',
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 1000,
                        overflow: 'hidden'
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: '1.25rem',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderRadius: '1.5rem 1.5rem 0 0'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Sparkles size={24} color="white" />
                            <div>
                                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                    Runli Assistant
                                </div>
                                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>
                                    Always here to help
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        >
                            <X size={18} color="white" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}
                    >
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start'
                                }}
                            >
                                <div
                                    style={{
                                        maxWidth: '75%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: msg.type === 'user' ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0',
                                        background: msg.type === 'user'
                                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                            : 'rgba(255,255,255,0.1)',
                                        color: 'white',
                                        fontSize: '0.95rem',
                                        lineHeight: '1.5',
                                        whiteSpace: 'pre-wrap'
                                    }}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '1rem 1rem 1rem 0',
                                    background: 'rgba(255,255,255,0.1)',
                                    color: '#a3a3a3',
                                    fontSize: '0.85rem',
                                    fontStyle: 'italic'
                                }}>
                                    Thinking...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions */}
                    {messages.length <= 2 && (
                        <div style={{ padding: '0 1.25rem 1rem' }}>
                            <div style={{ color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                Quick actions:
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                {quickActions.map((action, idx) => (
                                    <button
                                        key={idx}
                                        onClick={action.action}
                                        style={{
                                            padding: '0.6rem',
                                            background: 'rgba(16, 185, 129, 0.1)',
                                            border: '1px solid rgba(16, 185, 129, 0.3)',
                                            borderRadius: '0.5rem',
                                            color: '#10b981',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontWeight: 500
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                                            e.currentTarget.style.borderColor = '#10b981';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                                            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                                        }}
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div
                        style={{
                            padding: '1.25rem',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            gap: '0.75rem'
                        }}
                    >
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask me anything..."
                            style={{
                                flex: 1,
                                padding: '0.75rem 1rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '0.75rem',
                                color: 'white',
                                fontSize: '0.95rem',
                                outline: 'none',
                                transition: 'all 0.2s'
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#10b981'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isLoading}
                            style={{
                                padding: '0.75rem',
                                background: isLoading ? 'rgba(16, 185, 129, 0.5)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                borderRadius: '0.75rem',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(1.05)')}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <Send size={20} color="white" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
