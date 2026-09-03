import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { QuadrantApp } from '@quadrant/application';
import { manifest } from '@quadrant/capabilities';

@Controller()
export class AppController {
  constructor(private readonly quadrant: QuadrantApp) {}

  @Get()
  health() {
    return { name: 'quadrant', status: 'ok' };
  }

  @Get('manifest')
  getManifest() {
    return manifest;
  }

  @Post('capabilities/:id')
  invoke(@Param('id') id: string, @Body() body: unknown) {
    return this.quadrant.invoke(id, body ?? {});
  }
}
