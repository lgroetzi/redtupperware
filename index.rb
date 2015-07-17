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

get '/hall-of-faves' do
  erb :faves
end

get '/the-scoop' do
  erb :scoop
end

get '/login' do
  erb :login
end