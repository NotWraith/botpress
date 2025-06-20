FROM botpress/server:v12_30_4

# Optional: If using build-time env vars:
ARG RAILWAY_ENVIRONMENT
RUN echo "Deploying to $RAILWAY_ENVIRONMENT"

EXPOSE 3000
CMD ["./bp"]
