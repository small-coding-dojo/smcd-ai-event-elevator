using EventElevator.Hubs;
using EventElevator.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(builder.Configuration["AllowedOrigins"]!.Split(','))
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});
builder.Services.AddHostedService<ElevatorBroadcastService>();

var app = builder.Build();

app.UseCors("Frontend");
app.MapHub<ElevatorHub>("/hubs/elevator");

app.MapPost("/api/simulate/floor", (int floor, string direction) =>
{
    if (!Enum.TryParse<EventElevator.Events.ElevatorDirection>(direction, true, out var dir))
        return Results.BadRequest($"Invalid direction: {direction}. Use Up, Down, or Stationary.");

    EventElevator.EventAggregator.GetEventAggregator()
        .Add(new EventElevator.Events.FloorEvent(floor, dir, DateTimeOffset.UtcNow));

    return Results.Ok(new { floor, direction = dir.ToString() });
});

app.Run();

public partial class Program { }
