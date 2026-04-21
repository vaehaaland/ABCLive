alter table equipment
  add column if not exists needs_service boolean not null default false,
  add column if not exists needs_reorder boolean not null default false;
