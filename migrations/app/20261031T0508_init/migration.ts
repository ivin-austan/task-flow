#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/0a12e1295e55d62082672de76104bdaca90978dc4215abec8484cdcf9f9d2e29/contract';
import endContract from '../../snapshots/0a12e1295e55d62082672de76104bdaca90978dc4215abec8484cdcf9f9d2e29/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'TaskPriority',
        members: ['LOW', 'MEDIUM', 'HIGH'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'TaskStatus',
        members: ['TODO', 'IN_PROGRESS', 'COMPLETED'],
      }),
      this.createTable({
        schema: 'public',
        table: 'Task',
        columns: [
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1', typeParams: { precision: 3 } },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('dueDate', 'date', { codecRef: { codecId: 'pg/date-string@1' } }),
          col('id', 'uuid', {
            notNull: true,
            default: fn(sql`gen_random_uuid()`),
            codecRef: { codecId: 'pg/uuid@1' },
          }),
          col('priority', '"TaskPriority"', {
            notNull: true,
            default: lit('MEDIUM'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'TaskPriority' } },
          }),
          col('status', '"TaskStatus"', {
            notNull: true,
            default: lit('TODO'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'TaskStatus' } },
          }),
          col('title', 'character varying(120)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 120 } },
          }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Task',
        index: 'Task_createdAt_idx',
        columns: ['createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Task',
        index: 'Task_dueDate_idx',
        columns: ['dueDate'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Task',
        index: 'Task_status_priority_idx',
        columns: ['status', 'priority'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
