// import { useEffect, useState } from "react";

// const TeamSquad = () => {
//   const [squad, setSquad] = useState([]);
//   const API_KEY = "YOUR_API_KEY";

//   useEffect(() => {
//     fetch("https://v3.football.api-sports.io/players/squads?team=33", {
//       method: "GET",
//       headers: {
//         "x-rapidapi-host": "v3.football.api-sports.io",
//         "x-rapidapi-key": "e1cea611a4d193af4f01c7a61969b778",
//       },
//     })
//       .then((response) => response.json())
//       .then((data) => setSquad(data.response[0].players))
//       .catch((error) => console.error("Error fetching squad data:", error));
//   }, []);
//   console.log(squad);
//   return (
//     <div>
//       <h2>Team Squad</h2>
//       <ul>
//         {squad.map((player) => (
//           <li key={player.id}>
//             <img src={player.photo} alt={player.name} width="50" />
//             {player.name} - {player.position || "N/A"}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default TeamSquad;
