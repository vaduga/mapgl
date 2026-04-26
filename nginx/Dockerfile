FROM nginx:stable-alpine

## Environment
ENV API_HOST=localhost
ENV API_PORT=3002
ENV GRAFANA_HOST=localhost
ENV GRAFANA_PORT=3000

## Copy configuration
COPY default.conf /etc/nginx/templates/default.conf.template
COPY proxy.conf /etc/nginx/conf.d/proxy.conf
COPY devtestcom /etc/nginx/conf.d/devtest.conf
COPY ssl/ /etc/nginx/ssl/
COPY http_headers.conf /etc/nginx/conf.d/http_headers.conf

CMD ["nginx", "-g", "daemon off;"]
