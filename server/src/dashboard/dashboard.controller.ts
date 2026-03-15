import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@Request() req) {
    return this.dashboardService.getSummary(req.user);
  }

  @Get('feed')
  getFeed(@Request() req) {
    return this.dashboardService.getFeed(req.user);
  }

  @Get('top-doubt-classroom')
  getTopDoubtClassroom(@Request() req) {
    return this.dashboardService.getTopDoubtClassroom(req.user);
  }

  @Get('progress')
  getProgress(@Request() req) {
    return this.dashboardService.getProgress(req.user);
  }
}
