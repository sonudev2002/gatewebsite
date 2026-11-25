CREATE TABLE study_records (
  owner TEXT NOT NULL,
  record_key TEXT NOT NULL,
  payload TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY(owner,record_key)
);
