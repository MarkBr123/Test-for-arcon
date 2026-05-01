# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY . .

# Restore dependencies
RUN dotnet restore

# Build and publish
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# Copy published output
COPY --from=build /app/publish .

# Render uses PORT env variable
ENV ASPNETCORE_URLS=http://0.0.0.0:10000

# Replace with your DLL name
ENTRYPOINT ["dotnet", "ARCon_Capstone_2.dll"]