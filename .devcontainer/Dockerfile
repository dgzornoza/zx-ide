# Docker file with vscode devcontainer for debug extension in container
# this file require z88dk instalation and sjasmplus to use in debug session

FROM mcr.microsoft.com/vscode/devcontainers/base:latest

RUN apt-get update && apt-get install -y \
	build-essential \
	git \
	subversion \
	perl \
	nano

# --------------------------------------------------------------------
# z88dk requirements
ENV Z88DK_PATH="/opt/z88dk"

RUN apt-get install -y \
	libxml2 m4 curl libgmp-dev bison flex libxml2-dev pkg-config \
    libboost-dev texinfo cpanminus \
    && cpanm Template::Toolkit \
    && git clone --depth 1 --recursive https://github.com/z88dk/z88dk.git ${Z88DK_PATH}

RUN cpanm -l $HOME/perl5 --no-wget local::lib Template::Plugin::YAML

# Add, edit or uncomment the following lines to customize the z88dk compilation
# COPY clib_const.m4 ${Z88DK_PATH}/libsrc/_DEVELOPMENT/target/
# COPY config_sp1.m4 ${Z88DK_PATH}/libsrc/_DEVELOPMENT/target/zx/config/

RUN cd ${Z88DK_PATH} \
    && eval "$(perl -I$HOME/perl5/lib/perl5 -Mlocal::lib)" \
    && chmod 777 build.sh \
    && BUILD_SDCC=1 BUILD_SDCC_HTTP=1 ./build.sh    

ENV PATH="${Z88DK_PATH}/bin:${PATH}" \
    ZCCCFG="${Z88DK_PATH}/lib/config/"
	
# --------------------------------------------------------------------
# SJASMPLUS/PASMO requirements

ENV INSTALL_PATH="/opt"
ENV PASMO_PATH="/opt/pasmo"
ENV SJASMPLUS_PATH="/opt/sjasmplus"

# install PASMO ASM
COPY ./pasmo-0.5.5.tar.gz ${INSTALL_PATH}

RUN cd ${INSTALL_PATH} \
    && tar -zxvf ./pasmo-0.5.5.tar.gz \
    && rm ./pasmo-0.5.5.tar.gz \
    && mv ./pasmo-0.5.5 pasmo
    
# compile pasmo
RUN cd ${PASMO_PATH} \
    && chmod 777 configure \
    && ./configure \
    && make \
    && make install

# install SJASMPLUS ASM
RUN cd ${INSTALL_PATH} \
    && git clone --recursive -j8 https://github.com/z00m128/sjasmplus.git
    
RUN cd ${SJASMPLUS_PATH} \      
    && make \
    && make install

	
# --------------------------------------------------------------------
# vscode devcontainer requirements
RUN apt-get install -y \
	nodejs \
    npm
	

WORKDIR /workspaces/

