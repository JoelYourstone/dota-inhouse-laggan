using Dota2GSI;
using Dota2GSI.EventMessages;
using System;
using System.Linq;
using System.Threading;
using System.Net.Http;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System.Reflection;

namespace Dota2GSI_Example_program
{
    class Program
    {
        static GameStateListener _gsl;
        private static readonly HttpClient _httpClient = new HttpClient();

        static void Main(string[] args)
        {
            _gsl = new GameStateListener(4000);

            if (!_gsl.GenerateGSIConfigFile("Example"))
            {
                Console.WriteLine("Could not generate GSI configuration file.");
            }


            _gsl.NewGameState += OnNewGameState; // `NewGameState` can be used alongside `GameEvent`. Just not in this example.
            //_gsl.GameEvent += OnNewGameEvent;


            if (!_gsl.Start())
            {
                Console.WriteLine("GameStateListener could not start. Try running this program as Administrator. Exiting.");
                Console.ReadLine();
                Environment.Exit(0);
            }
            Console.WriteLine("Listening for game integration calls...");

            Console.WriteLine("Press ESC to quit");
            do
            {
                while (!Console.KeyAvailable)
                {
                    Thread.Sleep(1000);
                }
            } while (Console.ReadKey(true).Key != ConsoleKey.Escape);
        }

        //private static void OnNewGameEvent(DotaGameEvent game_event)
        //{

        //    var x = 2;
        //}

        //private static void OnGameEvent(DotaGameEvent game_event)
        //{

        //    // Print the game event type, like if the game_event is a ProviderUpdated, print "ProviderUpdated"
        //    Console.WriteLine($"Game event type: {game_event.GetType()}");


        //}


        //public class CustomContractResolver : DefaultContractResolver
        //{
        //    protected override JsonProperty CreateProperty(MemberInfo member, MemberSerialization memberSerialization)
        //    {
        //        JsonProperty property = base.CreateProperty(member, memberSerialization);

        //        // Example: Skip properties that are delegates (which typically can't be serialized).
        //        if (typeof(Delegate).IsAssignableFrom(property.PropertyType))
        //        {
        //            property.Ignored = true;
        //        }

        //        // Optionally, skip properties marked with [NonSerialized] if needed.
        //        if (member.GetCustomAttribute<NonSerializedAttribute>() != null)
        //        {
        //            property.Ignored = true;
        //        }

        //        return property;
        //    }
        //}

        // NewGameState example

        static void OnNewGameState(GameState gs)
        {
            //var settings = new JsonSerializerSettings
            //{
            //    // This handler will be called for any errors during serialization.
            //    Error = (sender, args) =>
            //    {
            //        // Mark the error as handled so it won't be thrown.
            //        args.ErrorContext.Handled = true;
            //    },
            //    ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
            //    MaxDepth = 2,

            //};

            //var serialized = JsonConvert.SerializeObject(gs, settings);




            var eventWithTipAmount = gs.Events.Where(e => e.TipAmount > 0);

            if (eventWithTipAmount.Any())
            {
                foreach (var e in eventWithTipAmount)
                {
                    var listOfTenPlayers = gs.RadiantTeamDetails.Players.Concat(gs.DireTeamDetails.Players).ToArray();

                    var tipSender = listOfTenPlayers[e.PlayerID];
                    var tipReceiver = listOfTenPlayers[e.TipReceiverPlayerID];


                    // Fire and forget the HTTP request while ensuring response is disposed
                    _ = _httpClient.GetAsync($"http://localhost:3024/?userId={tipSender.Value.Details.SteamID}")
                        .ContinueWith(t =>
                        {
                            if (t.IsFaulted)
                            {
                                Console.WriteLine($"Failed to send tip notification: {t.Exception?.GetBaseException().Message}");
                                return;
                            }
                            t.Result.Dispose();
                        });

                    Console.WriteLine($"Tip {e.TipAmount} to {e.TipReceiverPlayerID} from {e.PlayerID}");
                }
            }

        }
    }
}
