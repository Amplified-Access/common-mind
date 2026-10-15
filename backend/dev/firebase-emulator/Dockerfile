# Firebase Auth Emulator for local development. The auth emulator and its UI
# run on Node alone; no Java needed.
FROM node:22-bookworm-slim

ENV NO_UPDATE_NOTIFIER=1
RUN npm install -g firebase-tools@15.31.0

WORKDIR /firebase
COPY firebase.json entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 9099 4000
ENTRYPOINT ["./entrypoint.sh"]
