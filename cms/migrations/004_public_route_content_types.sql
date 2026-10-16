ALTER TABLE cms_content_items DROP CONSTRAINT IF EXISTS cms_content_items_content_type_check;
ALTER TABLE cms_content_items ADD CONSTRAINT cms_content_items_content_type_check
  CHECK (content_type IN ('home','machine','food','segment','solution','service','faq','company','insight','career','contact','partnership','privacy','search'));
