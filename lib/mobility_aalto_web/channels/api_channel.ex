defmodule MobilityAaltoWeb.ApiChannel do
    use Phoenix.Channel

    def join("api:data", _message, socket) do
        {:ok, socket}
    end
end