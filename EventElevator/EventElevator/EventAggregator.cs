using EventElevator.Events;

namespace EventElevator;

public class EventAggregator
{
    private readonly List<ButtonPressedEvent> _events = [];
    private readonly List<FloorEvent> _floorEvents = [];
    private static EventAggregator? _aggregator;

    public event Action<FloorEvent>? FloorEventRaised;

    private EventAggregator()
    {
    }

    public void Add(ButtonPressedEvent theEvent)
    {
        _events.Add(theEvent);
    }

    public void Add(FloorEvent floorEvent)
    {
        _floorEvents.Add(floorEvent);
        FloorEventRaised?.Invoke(floorEvent);
    }

    public static EventAggregator GetEventAggregator()
    {
        if (_aggregator is null)
        {
            _aggregator = new EventAggregator();
        }
        return _aggregator;
    }

    public ButtonPressedEvent? LastEvent()
    {
        return _events.LastOrDefault();
    }

    public FloorEvent? LastFloorEvent()
    {
        return _floorEvents.LastOrDefault();
    }
}
