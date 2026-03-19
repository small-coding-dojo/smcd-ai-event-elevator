using EventElevator.Events;
using Microsoft.AspNetCore.SignalR;

namespace EventElevator.Hubs;

public class ElevatorHub : Hub
{
    private readonly IConfiguration _config;

    public ElevatorHub(IConfiguration config) => _config = config;

    public Task<BuildingConfigurationDto> GetBuildingConfiguration()
        => Task.FromResult(new BuildingConfigurationDto(_config.GetValue<int>("Building:TotalFloors")));

    public Task<ElevatorStateDto?> GetCurrentElevatorState()
    {
        var last = EventAggregator.GetEventAggregator().LastFloorEvent();
        return Task.FromResult(last is null
            ? null
            : new ElevatorStateDto(last.FloorNumber, last.Direction, last.Timestamp));
    }
}

public record BuildingConfigurationDto(int TotalFloors);
public record ElevatorStateDto(int FloorNumber, ElevatorDirection Direction, DateTimeOffset Timestamp);
