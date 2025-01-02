# Docker file with vscode devcontainer for debug extension in container
# this file require z88dk instalation and sjasmplus to use in debug session

FROM mcr.microsoft.com/vscode/devcontainers/base:latest

RUN apt-get update && apt-get install -y \
	build-essential \
	git \
	subversion \	
	nano
	
# --------------------------------------------------------------------
# vscode devcontainer requirements
RUN apt-get install -y \
	nodejs \
    npm
	

WORKDIR /workspaces/
COPY . /workspace

