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

app.Run();

public partial class Program { }
