/// <reference types="vite/client" />
// Use Vite's built-in import.meta.env for environment variables
const API_BASE = import.meta.env.VITE_API_URL || "/api";

class APIClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    const config = {
      credentials: "include" as RequestCredentials,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `HTTP error ${response.status}`,
        }));

        // Structured error with status code and message
        const error = new Error(
          errorData.message || `HTTP ${response.status}`
        ) as Error & {
          status?: number;
          data?: any;
        };
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      let data = null;
      try {
        data = await response.json();
      } catch (e) {
        console.error("Invalid JSON response", e);
      }
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Authentication - Simplified for demo
  async login(email: string, password: string) {
    // For demo purposes, this won't be used
    throw new Error("Please select a role from the home page");
  }

  async register(name: string, email: string, password: string) {
    // For demo purposes, this won't be used
    throw new Error("Please select a role from the home page");
  }

  async logout() {
    // For demo purposes, just return success
    return { message: "Logged out successfully" };
  }

  async getCurrentUser() {
    // For demo purposes, return a default user
    // In a real app, this would check the actual user from cookies/tokens
    return {
      user: {
        id: 3,
        name: "Alice Smith",
        email: "alice.smith@student.lms.edu",
        role: "student",
        subscription_status: "free"
      }
    };
  }

  async getPredefinedUsers() {
    return this.request("/predefined-users");
  }

  async getUserProfile() {
    return this.request("/users/profile");
  }

  async updateUserProfile(data: any) {
    return this.request("/users/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request("/users/change-password", {
      method: "POST",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  }

  async updateNotificationPreferences(preferences: any) {
    return this.request("/users/notification-preferences", {
      method: "PUT",
      body: JSON.stringify(preferences),
    });
  }

  async updatePrivacySettings(settings: any) {
    return this.request("/users/privacy-settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }

  // AI Interactions
  async askQuestion(question: string) {
    return this.request("/ask", {
      method: "POST",
      body: JSON.stringify({ question }),
    });
  }

  async transcribeAudio(audioBlob: Blob) {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");

    return this.request("/voice", {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  // Quiz
  async getQuiz() {
    return this.request("/quiz");
  }

  async submitQuiz(answers: Array<{ questionId: number; isCorrect: boolean }>) {
    return this.request("/submit-quiz", {
      method: "POST",
      body: JSON.stringify({ answers }),
    });
  }

  // Dashboard
  async getDashboardData(range: string = "week") {
    return this.request(`/dashboard?range=${range}`);
  }
}

export const apiClient = new APIClient();
