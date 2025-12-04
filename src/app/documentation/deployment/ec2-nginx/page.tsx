import { CodeBlock } from "@/components/documentation/code-block"
import { DocAlert } from "@/components/documentation/doc-alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DeploymentEC2NginxPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">EC2 & nginx</h1>
        <p className="text-xl text-muted-foreground">
          Configuración detallada de nginx como reverse proxy y Gunicorn como servidor WSGI para la Flask API.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Instalación de nginx</h2>
        <CodeBlock
          code={`# Actualizar paquetes
sudo apt update

# Instalar nginx
sudo apt install -y nginx

# Verificar instalación
nginx -v

# Iniciar y habilitar nginx
sudo systemctl start nginx
sudo systemctl enable nginx`}
          language="bash"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Configuración de nginx</h2>
        <Card>
          <CardHeader>
            <CardTitle>Archivo de configuración</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock
              code={`server {
    listen 443 ssl http2;
    server_name api.tu-dominio.com;

    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/api.tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.tu-dominio.com/privkey.pem;

    # API Endpoints
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}`}
              language="nginx"
            />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Configuración de Gunicorn</h2>
        <Card>
          <CardHeader>
            <CardTitle>Gunicorn Config</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock
              code={`# gunicorn_config.py
import multiprocessing

workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'sync'
bind = '127.0.0.1:5000'
timeout = 120
accesslog = '/var/www/flask-api/logs/gunicorn-access.log'
errorlog = '/var/www/flask-api/logs/gunicorn-error.log'`}
              language="python"
            />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">SSL/TLS con Let&apos;s Encrypt</h2>
        <CodeBlock
          code={`# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d api.tu-dominio.com`}
          language="bash"
        />
        <DocAlert type="info">
          Certbot configurará automáticamente la renovación y actualizará nginx.
        </DocAlert>
      </section>

      <DocAlert type="info">
        Para documentación completa, consulta{" "}
        <code className="px-1.5 py-0.5 bg-muted rounded">docs/DEPLOYMENT_EC2_NGINX.md</code>
      </DocAlert>
    </div>
  )
}

