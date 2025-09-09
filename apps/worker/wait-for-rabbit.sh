#!/bin/bash
set -e

host="localhost"
port="5672"

echo "⏳ Esperando a RabbitMQ en $host:$port..."

while ! nc -z $host $port; do
  sleep 2
done

echo "✅ RabbitMQ está listo, iniciando app..."
exec npm start