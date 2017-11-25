defmodule Api.Fetcher do
    use GenServer

    def start_link(opts \\ []) do
        IO.puts "Starting Api.Fetcher"
        GenServer.start_link(__MODULE__, 0, opts)
    end

    def init(index) do 
        schedule_work()
        {:ok, index}
    end

    def handle_info(:work, index) do
        url = "https://llb.cloud.tyk.io/llb-bus-api/GetData?busId=9999"
        headers = ["Authorization": "Bearer 5a07a2f986f30e00015b3cb1afa018ee79d44e66aa0af1650516997c"]
        case HTTPoison.get(url, headers) do
            {:ok, %HTTPoison.Response{status_code: 200, body: body}} ->
                MobilityAaltoWeb.Endpoint.broadcast("api:data", "data", Poison.decode!(body)                )
                IO.puts "Got data #{index}"
            {:ok, %HTTPoison.Response{status_code: 404}} ->
                IO.puts "Error 404"
            {:error, %HTTPoison.Error{reason: reason}} ->
                IO.inspect reason
        end

        schedule_work()
        {:noreply, index + 1}
    end

    defp schedule_work() do
        IO.puts "Api.Fetcher.schedule_work"
        Process.send_after(self(), :work, 1000)
    end
end