import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto, ListUsersQueryDto } from './dto/user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@trustip/shared-types';
import type { JwtPayload } from '@trustip/shared-types';

@ApiTags('users')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'List all users (tenant-scoped)' })
  @ApiResponse({ status: 200, description: 'Paginated list of users' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListUsersQueryDto,
  ) {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    return this.usersService.findAll(user, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.TENANT_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<void> {
    await this.usersService.remove(id, user);
  }
}
