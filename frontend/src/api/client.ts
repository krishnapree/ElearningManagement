const API_BASE = "/api";

class APIClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
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

      return response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Authentication
  async login(email: string, password: string) {
    return this.request("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string) {
    return this.request("/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  }

  async logout() {
    return this.request("/logout", {
      method: "POST",
    });
  }

  async getCurrentUser() {
    return this.request("/user");
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
