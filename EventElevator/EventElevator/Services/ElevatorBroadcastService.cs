using EventElevator.Events;
using EventElevator.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace EventElevator.Services;

public class ElevatorBroadcastService : IHostedService
{
    private readonly IHubContext<ElevatorHub> _hubContext;

    public ElevatorBroadcastService(IHubContext<ElevatorHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        EventAggregator.GetEventAggregator().FloorEventRaised += OnFloorEvent;
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        EventAggregator.GetEventAggregator().FloorEventRaised -= OnFloorEvent;
        return Task.CompletedTask;
    }

    private async void OnFloorEvent(FloorEvent floorEvent)
    {
        await _hubContext.Clients.All.SendAsync("ReceiveFloorEvent",
            floorEvent.FloorNumber,
            floorEvent.Direction.ToString(),
            floorEvent.Timestamp.ToString("O"));
    }
}
