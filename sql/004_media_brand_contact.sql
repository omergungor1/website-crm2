-- Media Studio: marka kiti iletişim / sosyal hesaplar (görsel footer için)
alter table media_brand_kits add column if not exists contact jsonb not null default '{}'::jsonb;

-- Görseller her zaman ChatGPT'de üretilir; yalnızca videolar Gemini / Google Flow kullanır.
update media_prompts set target_platform = 'chatgpt' where media_type = 'image' and target_platform <> 'chatgpt';
