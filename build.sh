#!/bin/bash
network='mainnet'

GRAPH=${GRAPH:-graph}

graphNetwork=$network

NETWORK=$graphNetwork $GRAPH codegen -o generated --network $network --type $deployType
NETWORK=$graphNetwork $GRAPH build --network $network --type $deployType
