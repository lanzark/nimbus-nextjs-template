# Entendimiento Luchante

App de Lucha para armar y compartir expedientes de Entendimiento.

## Cómo se usa

1. Conectá Claude a `/api/mcp` de esta app.
2. Usá el prompt `armar-entendimiento` (o importá un HTML de plantilla con `importar_html`).
3. Al terminar, el expediente aparece en la lista. Abrilo y copiá el enlace.
4. Quien recibe el enlace (gente de Lucha) ve el documento y las instrucciones para conectar el mismo conector y usar `revisar-entendimiento`.

No hay chat en la página. La conversación vive en Claude.

## En esta máquina (local)

```bash
sudo pg_ctlcluster 18 main start
cd /home/ubuntu/entendimiento-luchante
npm run dev
```

Abrí http://localhost:3000  
MCP: http://localhost:3000/api/mcp  

`DATABASE_URL` está en `.env.local` (no se sube a git).
