-- Rode este SQL no SQL Editor do Supabase DEPOIS de rodar schema.sql.
-- Importa a lista oficial de 159 convidados (nomes duplicados são
-- intencionais — mesma pessoa/nome convidado por grupos diferentes).
-- Idempotente: só insere se a tabela ainda estiver vazia, então pode rodar
-- de novo sem duplicar caso já tenha sido executado.

insert into guest_list_official (full_name, full_name_normalized)
select v.name, lower(regexp_replace(trim(v.name), '\s+', ' ', 'g'))
from (values
  ('Fabiola'), ('Alexandre'), ('Matteo'), ('Janaina'), ('Jucineia'),
  ('Carlos'), ('Joselia'), ('Lair'), ('Gleice'), ('Leandro'),
  ('Cris'), ('Isabela'), ('Marcos vinicios'), ('Julia'), ('Cleuza'),
  ('Lidiane'), ('Thiago'), ('Penha'), ('Carol'), ('Lucia'),
  ('Claudio'), ('Simone Lopes'), ('Davi'), ('Heitor'), ('Enzo'),
  ('Antony'), ('Elizabeth'), ('Erica'), ('Samara'), ('Paulo'),
  ('Mario'), ('Pedro'), ('Marcia'), ('Cristian'), ('Isac'),
  ('Viviane'), ('Alisandra'), ('Marcio'), ('Raissa'), ('Gabriel'),
  ('Shirlei'), ('Alessandra'), ('Irineu'), ('Rogeria'), ('Kelly'),
  ('Leo'), ('Rafaela'), ('Antonio'), ('Isabelle'), ('Danilo'),
  ('Edmar'), ('Marcia'), ('Gustavo'), ('Julia'), ('Giovanna'),
  ('Daniel'), ('Aline'), ('Wanderson'), ('Fernanda'), ('Daniel'),
  ('Jordan'), ('Dani'), ('Yasmin'), ('Luana'), ('Cristiano'),
  ('Leonardo'), ('Filha'), ('Andreia'), ('Alexandre'), ('Samuel'),
  ('Cristiano'), ('Davi'), ('Ramon'), ('Sabrine'), ('Romulo'),
  ('Erica'), ('David'), ('Paloma'), ('Dim'), ('Jackeline'),
  ('Walisson'), ('Rosangela'), ('Guila'), ('Kaick'), ('Matheus'),
  ('Erick'), ('Eduardo'), ('Zildete'), ('Caique'), ('Ana Luiza'),
  ('Leonardo'), ('Adriano'), ('Silvia'), ('Wanderson'), ('Paula'),
  ('Maycon'), ('Amanda'), ('Angela'), ('Toninho'), ('Adriano'),
  ('Silvia'), ('Ivan'), ('Natalia'), ('Warlley'), ('Anna'),
  ('Diego'), ('Marques'), ('Erica'), ('Carol'), ('Marcos'),
  ('Lucia'), ('Serafio'), ('Esposo'), ('Cilmara'), ('Ronilma'),
  ('Ueverton'), ('Alice'), ('Enzo'), ('Andreza'), ('Tereza'),
  ('Mauro'), ('Kenia'), ('Namordo'), ('Luana'), ('Gleidna'),
  ('Jose'), ('Josuel'), ('Paulina'), ('Ana'), ('Larissa'),
  ('Claudio'), ('Sebastiao'), ('Daniela'), ('Julia'), ('Bernardo'),
  ('Daniel'), ('Paula'), ('Odair'), ('Sarah'), ('Gael'),
  ('Artur'), ('Robson'), ('Pabline'), ('Bento'), ('Willian'),
  ('Naiara'), ('Natalia'), ('Rodrigo'), ('Laura'), ('Natalia'),
  ('Janaina'), ('Aliciane'), ('Maria luiza'), ('Luiz'), ('Silvia'),
  ('Josanete'), ('Debora'), ('Rita'), ('Cida')
) as v(name)
where not exists (select 1 from guest_list_official);
