FROM node:18-slim
WORKDIR /app

# Change 'backend/' to whatever your folder is named on Hugging Face
COPY back-end/backend/package*.json ./
RUN npm install
COPY back-end/backend/ . 

ENV PORT=7860
EXPOSE 7860
CMD ["node", "index.js"]