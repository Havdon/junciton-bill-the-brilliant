defmodule MobilityAaltoWeb.PageController do
  use MobilityAaltoWeb, :controller

  def index(conn, _params) do
    render conn, "index.html"
  end
end
