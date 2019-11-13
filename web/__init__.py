# -*- coding: utf-8 -*-

import flask

server = flask.Flask(__name__, static_url_path='')

@server.route('/')
def index():
  return server.send_static_file("index.html")

if __name__ == "__main__":
  server.run()
