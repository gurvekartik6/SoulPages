FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY db ./db

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Basic container healthcheck against the API's own health route (which
# itself pings Postgres, so this also surfaces DB connectivity problems).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||5000)+'/api/health').then(r=>{if(r.ok)process.exit(0);process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "src/index.js"]
