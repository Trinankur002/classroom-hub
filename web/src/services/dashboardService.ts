import api from "./api";
import { DashboardFeed, DashboardSummary } from "@/types/dashboard";

class DashboardService {
  async getSummary(): Promise<{ data?: DashboardSummary; error?: string }> {
    try {
      const response = await api.get("/dashboard/summary");
      return { data: response.data as DashboardSummary };
    } catch (error: any) {
      console.error("Error fetching dashboard summary:", error);
      return {
        error: error?.response?.data?.message || error.message || "Something went wrong",
      };
    }
  }

  async getFeed(): Promise<{ data?: DashboardFeed; error?: string }> {
    try {
      const response = await api.get("/dashboard/feed");
      return { data: response.data as DashboardFeed };
    } catch (error: any) {
      console.error("Error fetching dashboard feed:", error);
      return {
        error: error?.response?.data?.message || error.message || "Something went wrong",
      };
    }
  }
}

export default new DashboardService();
