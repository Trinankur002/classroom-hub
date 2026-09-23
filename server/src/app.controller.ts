import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  getHello(): string {
    return this.appService.getHello();
  }

  @ApiOperation({ summary: 'Health check endpoint for cron-job.org and uptime monitors (/health)' })
  @ApiResponse({ status: 200, description: 'Returns real-time health status of database, redis, livekit, and storage.' })
  @Get('health')
  getHealth() {
    return this.appService.checkHealth();
  }

  @ApiOperation({ summary: 'Health check endpoint under API prefix (/api/health)' })
  @ApiResponse({ status: 200, description: 'Returns real-time health status of database, redis, livekit, and storage.' })
  @Get('api/health')
  getApiHealth() {
    return this.appService.checkHealth();
  }
}
