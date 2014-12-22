#!/usr/bin/perl

use strict;

use Getopt::Std;
use IO::Socket;

my %opts = (
  h => 0,
  H => '127.0.0.1',
  P => 8125,
  M => 'hello:1|c'
);

getopts('hH:P:M:', \%opts);


if ($opts{h}) {
  print "statsd-send [-h] [-H host] [-P port] [-M metric]\n";
  print "metrics are in the form for statsd\n";
  exit(0)
}

my $sock = IO::Socket::INET->new(
  Proto => 'udp',
  PeerPort => $opts{P},
  PeerAddr => $opts{H}
);

$sock->send($opts{M});
