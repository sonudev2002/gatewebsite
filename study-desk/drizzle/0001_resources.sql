CREATE TABLE catalog_pages (edition TEXT NOT NULL, page INTEGER NOT NULL, body TEXT NOT NULL, PRIMARY KEY(edition,page));
--> statement-breakpoint
CREATE TABLE note_images (owner TEXT NOT NULL, id TEXT NOT NULL, body TEXT NOT NULL, PRIMARY KEY(owner,id));
