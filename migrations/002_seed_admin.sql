-- Seed: Admin user padrão
-- Senha: admin123 (trocar depois)
-- Hash bcrypt gerado com 10 rounds
INSERT INTO admin_users (name, email, password_hash, role)
VALUES (
  'Administrador',
  'admin@galinhagorda.vip',
  '$2b$10$KwUbPmvZHWhuOpp2w0uAZeMOTtUHZMdJjrWpukeXcvFsVSxeaObm6',
  'superadmin'
)
ON CONFLICT (email) DO NOTHING;
