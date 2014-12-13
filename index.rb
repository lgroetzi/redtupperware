require 'rubygems'
require 'sinatra'

set :run, true
set :views, File.dirname(__FILE__) + "/views"

get '/' do
  erb :index
end

get '/admin' do
  erb :admin
end

get '/faves' do
  erb :faves
end