using EventElevator.Events;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;

namespace EventElevator.Tests;

public class ElevatorBroadcastServiceIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ElevatorBroadcastServiceIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task FloorEvent_IsBroadcast_ToConnectedClient()
    {
        var client = _factory.CreateClient();
        var hubConnection = new HubConnectionBuilder()
            .WithUrl($"{client.BaseAddress}hubs/elevator", options =>
            {
                options.HttpMessageHandlerFactory = _ => _factory.Server.CreateHandler();
            })
            .Build();

        FloorEvent? receivedEvent = null;
        var eventReceived = new TaskCompletionSource<bool>();

        hubConnection.On<int, string, string>("ReceiveFloorEvent", (floor, direction, timestamp) =>
        {
            receivedEvent = new FloorEvent(floor, Enum.Parse<ElevatorDirection>(direction), DateTimeOffset.Parse(timestamp));
            eventReceived.TrySetResult(true);
        });

        await hubConnection.StartAsync();

        var floorEvent = new FloorEvent(3, ElevatorDirection.Up, DateTimeOffset.UtcNow);
        EventAggregator.GetEventAggregator().Add(floorEvent);

        var completed = await Task.WhenAny(eventReceived.Task, Task.Delay(5000));
        Assert.True(completed == eventReceived.Task, "Did not receive ReceiveFloorEvent within 5 seconds");

        Assert.NotNull(receivedEvent);
        Assert.Equal(3, receivedEvent!.FloorNumber);
        Assert.Equal(ElevatorDirection.Up, receivedEvent.Direction);

        await hubConnection.DisposeAsync();
    }

    [Fact]
    public async Task NoFloorEvent_NoBroadcast()
    {
        var client = _factory.CreateClient();
        var hubConnection = new HubConnectionBuilder()
            .WithUrl($"{client.BaseAddress}hubs/elevator", options =>
            {
                options.HttpMessageHandlerFactory = _ => _factory.Server.CreateHandler();
            })
            .Build();

        var eventReceived = new TaskCompletionSource<bool>();

        hubConnection.On<int, string, string>("ReceiveFloorEvent", (_, _, _) =>
        {
            eventReceived.TrySetResult(true);
        });

        await hubConnection.StartAsync();

        // Don't add any FloorEvent — wait briefly and confirm nothing arrives
        var completed = await Task.WhenAny(eventReceived.Task, Task.Delay(1000));
        Assert.False(completed == eventReceived.Task, "Received unexpected ReceiveFloorEvent");

        await hubConnection.DisposeAsync();
    }
}
