#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/0a12e1295e55d62082672de76104bdaca90978dc4215abec8484cdcf9f9d2e29/contract';
import startContract from '../../snapshots/0a12e1295e55d62082672de76104bdaca90978dc4215abec8484cdcf9f9d2e29/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/84eef903a1524857887f3a886aa639d14f8a96758ffad57354cf2e2bbdc4af9e/contract';
import endContract from '../../snapshots/84eef903a1524857887f3a886aa639d14f8a96758ffad57354cf2e2bbdc4af9e/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'AuthSession',
        columns: [
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1', typeParams: { precision: 3 } },
          }),
          col('expiresAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1', typeParams: { precision: 3 } },
          }),
          col('tokenHash', 'character varying(64)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 64 } },
          }),
          col('userId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['tokenHash'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'User',
        columns: [
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1', typeParams: { precision: 3 } },
          }),
          col('email', 'character varying(254)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 254 } },
          }),
          col('emailVerifiedAt', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-string@1', typeParams: { precision: 3 } },
          }),
          col('id', 'uuid', {
            notNull: true,
            default: fn(sql`gen_random_uuid()`),
            codecRef: { codecId: 'pg/uuid@1' },
          }),
          col('passwordHash', 'character varying(255)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 255 } },
          }),
          col('verificationExpiresAt', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-string@1', typeParams: { precision: 3 } },
          }),
          col('verificationTokenHash', 'character varying(64)', {
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 64 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'Task',
        column: col('ownerEmail', 'character varying(254)', {
          codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 254 } },
        }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'User',
        constraint: 'User_email_key',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AuthSession',
        index: 'AuthSession_expiresAt_idx',
        columns: ['expiresAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AuthSession',
        index: 'AuthSession_userId_idx',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Task',
        index: 'Task_ownerEmail_idx',
        columns: ['ownerEmail'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'User',
        index: 'User_verificationExpiresAt_idx',
        columns: ['verificationExpiresAt'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
