import api from "./api";
import { DashboardFeed, DashboardProgress, DashboardSummary, DashboardTopDoubtClassroom } from "@/types/dashboard";

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

  async getTopDoubtClassroom(): Promise<{ data?: DashboardTopDoubtClassroom; error?: string }> {
    try {
      const response = await api.get("/dashboard/top-doubt-classroom");
      return { data: response.data as DashboardTopDoubtClassroom };
    } catch (error: any) {
      console.error("Error fetching top doubt classroom:", error);
      return {
        error: error?.response?.data?.message || error.message || "Something went wrong",
      };
    }
  }

  async getProgress(): Promise<{ data?: DashboardProgress; error?: string }> {
    try {
      const response = await api.get("/dashboard/progress");
      return { data: response.data as DashboardProgress };
    } catch (error: any) {
      console.error("Error fetching dashboard progress:", error);
      return {
        error: error?.response?.data?.message || error.message || "Something went wrong",
      };
    }
  }
}

export default new DashboardService();
