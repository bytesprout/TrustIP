import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { JwtPayload } from '@trustip/shared-types';
import { InvoiceService } from '../services/invoice.service';
import { CreateInvoiceDto } from '../dto/invoice.dto';

@ApiTags('billing')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'billing/invoices', version: '1' })
export class InvoicesController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get(':tenantId')
  @ApiOperation({ summary: 'List tenant invoices' })
  async list(@Param('tenantId') tenantId: string, @CurrentUser() user: JwtPayload) {
    return this.invoiceService.listForTenant(tenantId, user);
  }

  @Get(':tenantId/:invoiceId')
  @ApiOperation({ summary: 'Get tenant invoice' })
  async findOne(
    @Param('tenantId') tenantId: string,
    @Param('invoiceId') invoiceId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.invoiceService.findOne(tenantId, invoiceId, user);
  }

  @Post(':tenantId')
  @ApiOperation({ summary: 'Create invoice (admin)' })
  async create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateInvoiceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.invoiceService.create(tenantId, dto, user);
  }
}
