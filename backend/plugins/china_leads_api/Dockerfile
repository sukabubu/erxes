FROM node:18-alpine

WORKDIR /app

COPY backend/erxes-api-shared/dist ./erxes-api-shared/dist
COPY backend/plugins/china_leads_api/dist ./china_leads_api/dist
COPY backend/plugins/china_leads_api/package.json ./china_leads_api/

RUN cd china_leads_api && npm install --production

WORKDIR /app/china_leads_api
CMD ["node", "dist/main.js"]
