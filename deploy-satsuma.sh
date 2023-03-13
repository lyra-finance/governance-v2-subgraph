#!/bin/bash
network='goerli'
version=$1
name=$2
GRAPH=${GRAPH:-graph}

graphNetwork=$network

if [ $network = 'kovan-ovm' ]; then
  graphNetwork='optimism-kovan'
elif [ $network = 'goerli-ovm' ]; then
  graphNetwork='optimism-goerli'
elif [ $network = 'mainnet-ovm' ]; then
  graphNetwork='optimism'
elif [ $network = 'mainnet-arbi' ]; then
  graphNetwork='arbitrum-one'
elif [ $network = 'goerli-arbi' ]; then
  graphNetwork='arbitrum-goerli'
fi

NETWORK=$graphNetwork $GRAPH deploy $name --version-label $version --node https://app.satsuma.xyz/api/subgraphs/deploy --deploy-key $SATSUMA_KEY