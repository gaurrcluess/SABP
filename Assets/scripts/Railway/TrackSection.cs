using UnityEngine;

public class TrackSection : MonoBehaviour
{
    public string sectionId = "S01";

    public enum SectionState
    {
        Available,
        Occupied,
        Blocked,
        Maintenance
    }

    public SectionState currentState = SectionState.Available;
}
