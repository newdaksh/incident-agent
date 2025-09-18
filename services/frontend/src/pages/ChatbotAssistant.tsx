import { useState, useEffect, useRef } from "react";
import {
  PaperAirplaneIcon,
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface ChatMessage {
  id: string;
  author: "user" | "bot";
  text: string;
  timestamp: Date;
  suggestions?: string[];
  followups?: string[];
  confidence?: number;
  runbookSuggestions?: Array<{
    id: string;
    title: string;
    confidence: number;
  }>;
  actionButtons?: Array<{
    label: string;
    action: string;
    style: "primary" | "secondary" | "danger";
  }>;
}

interface IncidentContext {
  id?: string;
  title?: string;
  service?: string;
  severity?: string;
  description?: string;
}

function ChatbotAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [incidentContext] = useState<IncidentContext | null>(null);
  // const [sessionId] = useState(() => `session_${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage: ChatMessage = {
      id: "welcome",
      author: "bot",
      text: "Hi! I'm your incident response assistant. I can help you troubleshoot issues, find relevant runbooks, create tickets, and provide remediation suggestions. How can I assist you today?",
      timestamp: new Date(),
      suggestions: [
        "I'm experiencing a database issue",
        "Help me find a runbook for API problems",
        "Create an incident ticket",
        "Analyze recent alerts",
      ],
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      author: "user",
      text: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      // Simulate API call to chatbot service
      const response = await simulateChatbotResponse(
        messageText,
        incidentContext
      );

      setTimeout(() => {
        setMessages((prev) => [...prev, response]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to get chatbot response:", error);
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        author: "bot",
        text: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    switch (action) {
      case "create_ticket":
        window.open("/incidents/new", "_blank");
        break;
      case "escalate":
        await sendMessage("Please escalate this issue to the on-call engineer");
        break;
      case "find_runbook":
        await sendMessage("Show me relevant runbooks for this issue");
        break;
      case "generate_rca":
        await sendMessage("Help me generate an RCA for this incident");
        break;
      default:
        console.log("Unknown action:", action);
    }
  };

  const simulateChatbotResponse = async (
    userInput: string,
    _context: IncidentContext | null
  ): Promise<ChatMessage> => {
    // This would be replaced with actual API call to GenAI service
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes("database") || lowerInput.includes("db")) {
      return {
        id: `bot_${Date.now()}`,
        author: "bot",
        text: "I see you're experiencing database issues. Let me help you troubleshoot this. Based on common patterns, here are some immediate steps:",
        timestamp: new Date(),
        confidence: 0.85,
        suggestions: [
          "Check database connection pool status",
          "Review recent query performance",
          "Verify disk space and memory usage",
          "Check for long-running transactions",
        ],
        runbookSuggestions: [
          {
            id: "rb1",
            title: "Database Connection Pool Troubleshooting",
            confidence: 0.92,
          },
          { id: "rb2", title: "MySQL Performance Issues", confidence: 0.78 },
          {
            id: "rb3",
            title: "Database Connectivity Problems",
            confidence: 0.65,
          },
        ],
        actionButtons: [
          {
            label: "Create Incident",
            action: "create_ticket",
            style: "primary",
          },
          {
            label: "Find Runbooks",
            action: "find_runbook",
            style: "secondary",
          },
          { label: "Escalate", action: "escalate", style: "danger" },
        ],
      };
    }

    if (
      lowerInput.includes("api") ||
      lowerInput.includes("latency") ||
      lowerInput.includes("slow")
    ) {
      return {
        id: `bot_${Date.now()}`,
        author: "bot",
        text: "API performance issues can have several causes. Let me guide you through a systematic approach to identify the root cause:",
        timestamp: new Date(),
        confidence: 0.91,
        suggestions: [
          "Check API response times and error rates",
          "Review recent deployments",
          "Verify downstream service health",
          "Check load balancer and caching layers",
        ],
        runbookSuggestions: [
          {
            id: "rb4",
            title: "API Performance Troubleshooting",
            confidence: 0.95,
          },
          { id: "rb5", title: "Load Balancer Issues", confidence: 0.73 },
          { id: "rb6", title: "Cache Miss Investigation", confidence: 0.68 },
        ],
        actionButtons: [
          {
            label: "Start Diagnostic",
            action: "find_runbook",
            style: "primary",
          },
          {
            label: "Create Incident",
            action: "create_ticket",
            style: "secondary",
          },
        ],
      };
    }

    if (lowerInput.includes("runbook")) {
      return {
        id: `bot_${Date.now()}`,
        author: "bot",
        text: "I can help you find the most relevant runbooks. What type of issue are you dealing with?",
        timestamp: new Date(),
        confidence: 0.88,
        suggestions: [
          "Database performance issues",
          "API connectivity problems",
          "Frontend application errors",
          "Infrastructure and networking",
          "Security incidents",
        ],
        followups: [
          "What service is affected?",
          "What symptoms are you observing?",
          "When did the issue start?",
        ],
      };
    }

    if (
      lowerInput.includes("create") ||
      lowerInput.includes("ticket") ||
      lowerInput.includes("incident")
    ) {
      return {
        id: `bot_${Date.now()}`,
        author: "bot",
        text: "I'll help you create an incident ticket. Based on our conversation, I can pre-fill some details. What information would you like to include?",
        timestamp: new Date(),
        confidence: 0.95,
        actionButtons: [
          {
            label: "Create Incident Now",
            action: "create_ticket",
            style: "primary",
          },
          {
            label: "Add More Details",
            action: "continue_chat",
            style: "secondary",
          },
        ],
        followups: [
          "What's the severity of this issue?",
          "Which service is affected?",
          "How many users are impacted?",
        ],
      };
    }

    if (lowerInput.includes("rca") || lowerInput.includes("root cause")) {
      return {
        id: `bot_${Date.now()}`,
        author: "bot",
        text: "I can help you generate a comprehensive Root Cause Analysis. I'll analyze the incident timeline, contributing factors, and provide prevention recommendations.",
        timestamp: new Date(),
        confidence: 0.87,
        actionButtons: [
          { label: "Generate RCA", action: "generate_rca", style: "primary" },
          { label: "RCA Template", action: "rca_template", style: "secondary" },
        ],
        followups: [
          "What was the incident timeline?",
          "What were the immediate causes?",
          "What prevention measures are needed?",
        ],
      };
    }

    // Default response
    return {
      id: `bot_${Date.now()}`,
      author: "bot",
      text: "I understand you need help with that. Could you provide more specific details about the issue you're experiencing? For example, which service is affected, what symptoms you're seeing, or what type of assistance you need?",
      timestamp: new Date(),
      confidence: 0.7,
      suggestions: [
        "I'm having database issues",
        "API is running slowly",
        "Help me find a runbook",
        "Create an incident ticket",
        "Generate an RCA report",
      ],
    };
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <ChatBubbleLeftIcon className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Incident Assistant
            </h2>
            <p className="text-sm text-gray-600">
              AI-powered incident response support
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {incidentContext && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Context: {incidentContext.title}
            </span>
          )}
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            Online
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.author === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.author === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className="text-xs opacity-75 mt-1">
                {formatTime(message.timestamp)}
              </p>

              {/* Bot confidence */}
              {message.author === "bot" && message.confidence && (
                <div className="mt-2 text-xs opacity-75">
                  Confidence: {Math.round(message.confidence * 100)}%
                </div>
              )}

              {/* Suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium opacity-75">Suggestions:</p>
                  {message.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(suggestion)}
                      className="block w-full text-left text-xs p-2 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Runbook suggestions */}
              {message.runbookSuggestions &&
                message.runbookSuggestions.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-medium opacity-75 flex items-center">
                      <DocumentTextIcon className="h-3 w-3 mr-1" />
                      Relevant Runbooks:
                    </p>
                    {message.runbookSuggestions.map((runbook) => (
                      <button
                        key={runbook.id}
                        onClick={() =>
                          window.open(`/runbooks/${runbook.id}`, "_blank")
                        }
                        className="block w-full text-left text-xs p-2 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <span>{runbook.title}</span>
                          <span className="opacity-75">
                            {Math.round(runbook.confidence * 100)}%
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

              {/* Action buttons */}
              {message.actionButtons && message.actionButtons.length > 0 && (
                <div className="mt-3 space-y-1">
                  {message.actionButtons.map((button, index) => (
                    <button
                      key={index}
                      onClick={() => handleAction(button.action)}
                      className={`block w-full text-center text-xs px-3 py-2 rounded transition-colors ${
                        button.style === "primary"
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : button.style === "danger"
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-white bg-opacity-20 hover:bg-opacity-30"
                      }`}
                    >
                      {button.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Follow-up questions */}
              {message.followups && message.followups.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium opacity-75">
                    Follow-up questions:
                  </p>
                  {message.followups.map((followup, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(followup)}
                      className="block w-full text-left text-xs p-2 bg-white bg-opacity-10 rounded hover:bg-opacity-20 transition-colors"
                    >
                      {followup}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask about incidents, runbooks, or troubleshooting..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!inputText.trim() || isLoading}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Quick actions */}
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => sendMessage("Help me troubleshoot an issue")}
            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
          >
            🔧 Troubleshoot
          </button>
          <button
            onClick={() => sendMessage("Find relevant runbooks")}
            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
          >
            📚 Runbooks
          </button>
          <button
            onClick={() => sendMessage("Create an incident ticket")}
            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
          >
            🎫 Create Ticket
          </button>
          <button
            onClick={() => sendMessage("Generate RCA report")}
            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
          >
            📊 RCA
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatbotAssistant;
