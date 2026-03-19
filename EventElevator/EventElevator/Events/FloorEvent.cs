namespace EventElevator.Events;

public record FloorEvent(int FloorNumber, ElevatorDirection Direction, DateTimeOffset Timestamp);

public enum ElevatorDirection { Up, Down, Stationary }
