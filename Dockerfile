FROM botpress/server:v12_30_4

# Volume for persistence
VOLUME /botpress/data

# Expose Botpress port
EXPOSE 3000

# Run the Botpress binary
CMD ["./bp"]
